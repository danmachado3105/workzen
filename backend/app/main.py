from fastapi import FastAPI

app = FastAPI(title="WorkZen API")


@app.get("/health")
def health_check():
    return {"status": "ok"}