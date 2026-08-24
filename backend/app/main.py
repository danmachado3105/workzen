from fastapi import FastAPI

from app.clients.router import router as clients_router

app = FastAPI(title="WorkZen API")

app.include_router(clients_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}