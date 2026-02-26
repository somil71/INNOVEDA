from fastapi.testclient import TestClient


def ws_exchange(client: TestClient, path_a: str, path_b: str, payload: dict, token_a: str, token_b: str):
    path_a = f"{path_a}?token={token_a}"
    path_b = f"{path_b}?token={token_b}"
    with client.websocket_connect(path_a) as ws_a, client.websocket_connect(path_b) as ws_b:
        ws_a.send_json(payload)
        return ws_b.receive_json()
