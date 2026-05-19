from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """
    요청 body: camelCase 또는 snake_case 모두 허용 (populate_by_name=True)
    응답 body: response_model_by_alias=True 설정 시 camelCase로 직렬화
    """
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )
