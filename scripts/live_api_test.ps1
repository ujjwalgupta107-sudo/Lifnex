$baseUrl = "http://127.0.0.1:5000/api/v1"

# 1. Patient Registration & Login
Write-Output "=== 1. PATIENT WORKFLOW ==="
$patientPayload = @{
    email = "live.patient.test@example.com"
    password = "LivePassword123!"
    full_name = "Live Test Patient"
    role = "patient"
    phone_number = "+15559876543"
} | ConvertTo-Json

try {
    $regRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $patientPayload -ContentType "application/json"
    Write-Output "Patient Registration: PASS (UserID: $($regRes.data.user.id), Role: $($regRes.data.user.role))"
    $patientToken = $regRes.data.session.access_token
} catch {
    Write-Output "Patient Registration: FAIL ()"
}

# 2. Create Emergency Blood Request
$reqPayload = @{
    patient_id = "c1f72944-e22e-4b47-975f-2a3b7c846d02"
    hospital_id = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
    blood_group = "O-"
    units_required = 2
    urgency_level = "critical"
    required_by = "2026-11-12T12:00:00Z"
    clinical_notes = "Trauma emergency live test requisition."
} | ConvertTo-Json

$headers = @{ "Authorization" = "Bearer $patientToken" }

try {
    $reqRes = Invoke-RestMethod -Uri "$baseUrl/blood-requests" -Method Post -Body $reqPayload -ContentType "application/json" -Headers $headers
    $createdReqId = $reqRes.data.id
    Write-Output "Blood Request Created: PASS (RequestID: $createdReqId, Status: $($reqRes.data.status))"
} catch {
    Write-Output "Blood Request Created: FAIL ()"
}

# 3. Check Potential Donor Discovery
try {
    $matchRes = Invoke-RestMethod -Uri "$baseUrl/blood-requests/c1f72944-e22e-4b47-975f-2a3b7c846d02/matching-donors" -Method Get -Headers $headers
    Write-Output "Donor Discovery: PASS (Found $($matchRes.data.Count) matching donors)"
} catch {
    Write-Output "Donor Discovery: FAIL ()"
}

# 4. Donor Workflow
Write-Output "
=== 2. DONOR WORKFLOW ==="
$donorToken = ""
$donorPayload = @{
    email = "live.donor.test@example.com"
    password = "LivePassword123!"
    full_name = "Live Test Donor"
    role = "donor"
    phone_number = "+15551239876"
    blood_group = "O-"
} | ConvertTo-Json

try {
    $dRegRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $donorPayload -ContentType "application/json"
    $donorToken = $dRegRes.data.session.access_token
    Write-Output "Donor Registration: PASS (UserID: $($dRegRes.data.user.id), Role: $($dRegRes.data.user.role))"
} catch {
    Write-Output "Donor Registration: FAIL ()"
}

$donorHeaders = @{ "Authorization" = "Bearer $donorToken" }

# Donor Feed
try {
    $feedRes = Invoke-RestMethod -Uri "$baseUrl/donors/feed" -Method Get -Headers $donorHeaders
    Write-Output "Donor Feed: PASS (Total Requests in Feed: $($feedRes.data.Count))"
} catch {
    Write-Output "Donor Feed: FAIL ()"
}

# Donor Response
$respPayload = @{
    request_id = "c1f72944-e22e-4b47-975f-2a3b7c846d02"
    donor_id = "demo-user-donor-id"
    response_status = "accepted"
    estimated_arrival_minutes = 20
    notes = "On my way to Metro Central Trauma."
} | ConvertTo-Json

try {
    $respondRes = Invoke-RestMethod -Uri "$baseUrl/donors/respond" -Method Post -Body $respPayload -ContentType "application/json" -Headers $donorHeaders
    Write-Output "Donor Dispatch Response: PASS (Status: $($respondRes.data.response_status), ETA: $($respondRes.data.estimated_arrival_minutes) min)"
} catch {
    Write-Output "Donor Dispatch Response: FAIL ()"
}

# 5. Patient Checks Responses
try {
    $viewRespRes = Invoke-RestMethod -Uri "$baseUrl/blood-requests/c1f72944-e22e-4b47-975f-2a3b7c846d02/responses" -Method Get -Headers $headers
    Write-Output "Patient View Incoming Responses: PASS (Responses Count: $($viewRespRes.data.Count))"
} catch {
    Write-Output "Patient View Incoming Responses: FAIL ()"
}

# 6. Notifications
try {
    $notifRes = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method Get -Headers $headers
    Write-Output "Notifications Retrieval: PASS (Unread: $($notifRes.unread_count))"
} catch {
    Write-Output "Notifications Retrieval: FAIL ()"
}

# 7. AI Services
Write-Output "
=== 3. AI SERVICES ==="
$triagePayload = @{
    unstructured_notes = "Trauma emergency in ER! 35 yo male with internal bleeding, urgently needs 3 units of B positive blood within 2 hours at City Care Hospital."
} | ConvertTo-Json

try {
    $aiTriageRes = Invoke-RestMethod -Uri "$baseUrl/ai/triage-assistant" -Method Post -Body $triagePayload -ContentType "application/json"
    Write-Output "AI Emergency Triage: PASS (Extracted Blood Group: $($aiTriageRes.data.structured_request.blood_group), Urgency: $($aiTriageRes.data.structured_request.urgency_level))"
} catch {
    Write-Output "AI Emergency Triage: FAIL ()"
}

$guidancePayload = @{
    blood_group = "O-"
    donor_weight_kg = 72
} | ConvertTo-Json

try {
    $aiGuideRes = Invoke-RestMethod -Uri "$baseUrl/ai/donor-guidance" -Method Post -Body $guidancePayload -ContentType "application/json"
    Write-Output "AI Donor Guidance: PASS (Universal Donor: $($aiGuideRes.data.compatibility.is_universal_donor))"
} catch {
    Write-Output "AI Donor Guidance: FAIL ()"
}

# 8. Hospitals Directory
Write-Output "
=== 4. HOSPITAL & MAP DATA ==="
try {
    $hospRes = Invoke-RestMethod -Uri "$baseUrl/hospitals" -Method Get
    Write-Output "Hospitals Directory: PASS (Found $($hospRes.data.Count) connected hospitals)"
} catch {
    Write-Output "Hospitals Directory: FAIL ()"
}
