"""
VERCEL SERVERLESS ENTRYPOINT ALIAS (wsgi.py)
Delegates to run.py
"""
from run import app

if __name__ == "__main__":
    app.run()
