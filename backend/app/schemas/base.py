from pydantic import BaseModel, ConfigDict


class ApiModel(BaseModel):
    # Allow using field names even when aliases exist (e.g. `class_` with alias `class`)
    model_config = ConfigDict(populate_by_name=True)

