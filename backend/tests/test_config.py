import pytest

from app.config import Settings


def test_cors_origins_are_normalized():
    settings = Settings(
        database_url="sqlite:///:memory:",
        secret_key="test-secret",
        cors_origins="https://app.workzen.test/, https://admin.workzen.test",
    )

    assert settings.cors_origins_list == [
        "https://app.workzen.test",
        "https://admin.workzen.test",
    ]


@pytest.mark.parametrize("cors_origins", ["", "*"])
def test_cors_origins_reject_unsafe_or_empty_values(cors_origins):
    settings = Settings(
        database_url="sqlite:///:memory:",
        secret_key="test-secret",
        cors_origins=cors_origins,
    )

    with pytest.raises(ValueError, match="CORS_ORIGINS"):
        _ = settings.cors_origins_list
