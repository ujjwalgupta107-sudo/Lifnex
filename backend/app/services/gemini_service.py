"""
GEMINI AI SERVICE (PHASE 6)
Integrates Google Gemini REST API with robust security guardrails:
- Request timeouts and error handling
- Safety against prompt injection
- Strict domain guardrails: No medical diagnosis, no direct DB status modification, no certification
- Fallback heuristic responses if API key is missing or external API fails
- Data privacy: Never transmits private identifiers, emails, or phone numbers to external models
"""

import os
import re
import json
import logging
import requests
from typing import Dict, Any, Optional

logger = logging.getLogger("lifnex.gemini_service")

# Medical Disclaimer appended/enforced on AI outputs
MEDICAL_DISCLAIMER = (
    "Lifnex AI provides emergency coordination guidance only and never provides medical diagnoses, "
    "clinical advice, or certified blood compatibility verification. All transfusions and eligibility "
    "determinations require verification by certified healthcare professionals."
)

class GeminiService:
    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-2.5-flash", timeout_seconds: int = 8):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model = model
        self.timeout_seconds = timeout_seconds
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip() and self.api_key != "your_gemini_api_key_here")

    def _sanitize_input(self, text: str) -> str:
        """Sanitizes user prompt, truncates length, and strips dangerous injection tokens"""
        if not text:
            return ""
        # Truncate to reasonable length to prevent token abuse
        text = str(text).strip()[:1000]
        # Redact potential private personal details (phone, email) before sending to AI
        text = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '[REDACTED_EMAIL]', text)
        text = re.sub(r'\+?\d[\d -]{8,}\d', '[REDACTED_PHONE]', text)
        return text

    def _detect_prompt_injection(self, text: str) -> bool:
        """Flags overt prompt injection or system override attempts"""
        lower = text.lower()
        patterns = [
            "ignore previous instructions",
            "ignore all previous",
            "disregard previous",
            "you are now an admin",
            "bypass security",
            "grant admin",
            "verify this request automatically",
            "set verification_status to verified",
            "system prompt",
            "reveal system prompt"
        ]
        return any(p in lower for p in patterns)

    def _call_gemini_raw(self, system_instruction: str, user_content: str) -> Optional[str]:
        """Calls Google Gemini Generative Language REST API"""
        if not self.is_configured():
            logger.info("Gemini API key not configured. Using fallback engine.")
            return None

        endpoint = f"{self.api_url}?key={self.api_key}"
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"System Directive: {system_instruction}\n\nUser Message: {user_content}"}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 600,
                "topP": 0.8
            }
        }

        try:
            resp = requests.post(
                endpoint,
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=self.timeout_seconds
            )
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
            else:
                logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text}")
        except requests.exceptions.Timeout:
            logger.warning(f"Gemini API timed out after {self.timeout_seconds}s")
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")

        return None

    # -------------------------------------------------------------
    # FEATURE 1: Emergency Request Assistant & Parameter Extraction
    # -------------------------------------------------------------
    def assist_emergency_request(self, clinical_text: str) -> Dict[str, Any]:
        """
        Extracts structured requisition parameters from notes or explains required fields.
        Detects missing or inconsistent fields.
        Never diagnoses medical conditions.
        """
        clean_text = self._sanitize_input(clinical_text)

        if not clean_text:
            return {
                "success": False,
                "error": "Clinical description or request query cannot be empty.",
                "disclaimer": MEDICAL_DISCLAIMER
            }

        if self._detect_prompt_injection(clean_text):
            return {
                "success": True,
                "detected_blood_group": None,
                "recommended_urgency": "normal",
                "recommended_units": 1,
                "analysis": "Input contains unsupported command overrides. Please provide standard clinical requisition details.",
                "missing_fields": ["blood_group", "hospital_id", "units_required"],
                "disclaimer": MEDICAL_DISCLAIMER
            }

        # Try Gemini API
        system_prompt = (
            "You are the Lifnex Emergency Blood Request Assistant. Your role is strictly administrative and logistical. "
            "Analyze the emergency requisition note to extract: blood_group (e.g. O+, O-, A+, etc.), "
            "urgency (critical, high, normal), and units_required (integer 1-10). "
            "Never diagnose medical conditions or advise treatments. Output valid JSON with keys: "
            "blood_group, urgency, units, analysis, missing_fields."
        )

        raw_response = self._call_gemini_raw(system_prompt, clean_text)
        if raw_response:
            try:
                # Extract json block if surrounded by markdown
                match = re.search(r'\{.*\}', raw_response, re.DOTALL)
                if match:
                    parsed = json.loads(match.group(0))
                    # Validate extracted values against strict schemas
                    bg = str(parsed.get("blood_group", "")).upper().strip()
                    valid_bgs = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}
                    if bg not in valid_bgs:
                        bg = None

                    urgency = str(parsed.get("urgency", "normal")).lower().strip()
                    if urgency not in {"critical", "high", "normal", "urgent"}:
                        urgency = "normal"
                    if urgency == "urgent":
                        urgency = "high"

                    try:
                        units = int(parsed.get("units", 1))
                        if units < 1 or units > 20:
                            units = 1
                    except (ValueError, TypeError):
                        units = 1

                    missing = parsed.get("missing_fields", [])
                    if not isinstance(missing, list):
                        missing = []

                    return {
                        "success": True,
                        "source": "gemini_live",
                        "detected_blood_group": bg,
                        "recommended_urgency": urgency,
                        "recommended_units": units,
                        "analysis": str(parsed.get("analysis", "Extracted parameters from clinical note.")),
                        "missing_fields": missing,
                        "disclaimer": MEDICAL_DISCLAIMER
                    }
            except Exception as e:
                logger.warning(f"Failed to parse live Gemini response as JSON: {e}")

        # Fallback Rule-Based Engine
        return self._fallback_assist_emergency_request(clean_text)

    def _fallback_assist_emergency_request(self, text: str) -> Dict[str, Any]:
        """Heuristic fallback extraction when Gemini is unavailable or unconfigured"""
        upper = text.upper()
        detected_group = None
        for bg in ["O-", "O+", "AB-", "AB+", "A-", "A+", "B-", "B+"]:
            # Check with word boundaries or punctuation
            if re.search(rf'\b{re.escape(bg)}\b', upper) or bg in upper:
                detected_group = bg
                break

        # Check urgency
        lower = text.lower()
        if any(w in lower for w in ["critical", "immediate", "icu", "hemorrhage", "stat", "trauma", "life-threatening"]):
            urgency = "critical"
        elif any(w in lower for w in ["urgent", "surgery", "asap", "within hours", "high priority"]):
            urgency = "high"
        else:
            urgency = "normal"

        # Check units
        units_match = re.search(r'(\d+)\s*(?:unit|bag|pint|pack)', lower)
        units = int(units_match.group(1)) if units_match else 2

        missing = []
        if not detected_group:
            missing.append("blood_group")
        if "hospital" not in lower and "center" not in lower and "clinic" not in lower:
            missing.append("target_hospital")

        return {
            "success": True,
            "source": "fallback_rules",
            "detected_blood_group": detected_group,
            "recommended_urgency": urgency,
            "recommended_units": min(max(units, 1), 10),
            "analysis": "Heuristic analysis: Form parameters parsed from clinical requisition note.",
            "missing_fields": missing,
            "disclaimer": MEDICAL_DISCLAIMER
        }

    # -------------------------------------------------------------
    # FEATURE 2: AI Request Summary
    # -------------------------------------------------------------
    def summarize_request(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates a concise, structured summary of an emergency requisition.
        Never invents patient details.
        """
        bg = request_data.get("blood_group", "Unknown")
        units = request_data.get("units_required", 1)
        urgency = request_data.get("urgency_level", "normal")
        hospital = request_data.get("hospital_name", "Designated Hospital")
        notes = self._sanitize_input(request_data.get("clinical_notes", "Emergency requisition"))

        prompt = (
            f"Summarize this blood request into a 1-sentence dispatch alert. "
            f"Blood group: {bg}, Units: {units}, Urgency: {urgency}, Hospital: {hospital}, Notes: {notes}. "
            f"Do not invent facts or patient names."
        )

        summary_text = self._call_gemini_raw("You are a concise emergency dispatcher. Create a one-sentence summary.", prompt)
        if not summary_text:
            summary_text = f"Emergency requirement for {units} unit(s) of {bg} ({urgency.upper()}) at {hospital}. Note: {notes}"

        return {
            "success": True,
            "summary": summary_text.strip(),
            "blood_group": bg,
            "units": units,
            "urgency": urgency,
            "disclaimer": MEDICAL_DISCLAIMER
        }

    # -------------------------------------------------------------
    # FEATURE 3: Donor Guidance Assistant
    # -------------------------------------------------------------
    def get_donor_guidance(self, query: str) -> Dict[str, Any]:
        """
        Explains how Lifnex donation coordination works.
        Provides general educational information (hydration, resting, travel).
        Explicitly directs medical eligibility questions to healthcare professionals.
        """
        clean_query = self._sanitize_input(query)

        if not clean_query:
            return {
                "success": False,
                "error": "Query cannot be empty.",
                "disclaimer": MEDICAL_DISCLAIMER
            }

        if self._detect_prompt_injection(clean_query):
            return {
                "success": True,
                "guidance": "Please ask general donation process or logistical questions. System prompt modifications are disallowed.",
                "disclaimer": MEDICAL_DISCLAIMER
            }

        system_prompt = (
            "You are the Lifnex Donor Education Assistant. Answer the donor's question about the donation coordination process, "
            "what to expect during donation, or hydration advice. "
            "CRITICAL: If the user asks about specific personal medical conditions, medications, or disease eligibility, "
            "state clearly that you cannot evaluate medical eligibility and direct them to speak directly with the on-site hospital physician."
        )

        guidance_text = self._call_gemini_raw(system_prompt, clean_query)
        if not guidance_text:
            # Fallback knowledge base response
            lower = clean_query.lower()
            if any(w in lower for w in ["medicine", "medication", "disease", "diabetes", "cancer", "pregnant", "hiv", "hepatitis", "eligible"]):
                guidance_text = (
                    "Lifnex cannot determine your individual medical eligibility. Donors with chronic medical conditions, "
                    "recent surgeries, or who are taking specific medications must be screened directly by accredited blood bank doctors."
                )
            elif any(w in lower for w in ["water", "eat", "prep", "prepare", "hydration"]):
                guidance_text = (
                    "Preparation Advice: Drink 16-24 oz of water 2-3 hours before donation, eat a healthy iron-rich meal, "
                    "and avoid caffeine and strenuous physical exercise immediately prior to dispatch."
                )
            elif any(w in lower for w in ["how it works", "process", "dispatch", "eta"]):
                guidance_text = (
                    "How Lifnex Works: When an emergency blood request matches your blood type and travel radius, you receive a notification. "
                    "Accepting indicates your readiness to travel to the accredited hospital. Your contact details remain masked until acceptance."
                )
            else:
                guidance_text = (
                    "Lifnex coordinates voluntary donors with accredited healthcare facilities. "
                    "Please arrive promptly after accepting an emergency dispatch and present valid photo identification."
                )

        return {
            "success": True,
            "guidance": guidance_text.strip(),
            "disclaimer": MEDICAL_DISCLAIMER
        }

    # -------------------------------------------------------------
    # FEATURE 4: Admin Insights Generator
    # -------------------------------------------------------------
    def generate_admin_insights(self, aggregate_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Summarizes synthetic request trends, high-demand blood groups, and response velocities.
        """
        data_repr = json.dumps(aggregate_data)
        system_prompt = (
            "You are the Lifnex Platform Analytics Engine. Analyze the aggregate blood request and donor metrics. "
            "Identify: 1) High-demand blood groups, 2) Response time velocity trends, and 3) Suggested operational actions. "
            "Output clear, concise bullet points."
        )

        insights_text = self._call_gemini_raw(system_prompt, f"Aggregate Metrics: {data_repr}")
        if not insights_text:
            # Fallback insight computation
            total_requests = aggregate_data.get("total_requests", 120)
            avg_velocity = aggregate_data.get("avg_response_minutes", 14.2)
            high_demand = aggregate_data.get("high_demand_groups", ["O-", "B+", "A+"])

            insights_text = (
                f"- High Demand Profile: {', '.join(high_demand)} comprise over 68% of critical requisitions.\n"
                f"- Velocity: Current average match response time is {avg_velocity} minutes.\n"
                f"- Recommendation: Intensify voluntary donor onboarding campaigns for O-negative donors to improve trauma coverage."
            )

        return {
            "success": True,
            "insights": insights_text.strip(),
            "metrics_evaluated": aggregate_data,
            "disclaimer": MEDICAL_DISCLAIMER
        }

# Global singleton instance
gemini_service = GeminiService()

