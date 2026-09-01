# Compatibility Policy

## Versioning

The API uses URI-path versioning. Every API path starts with `/v1/`. The OpenAPI document version in `info.version` is separate from the API path version.

## Compatible Changes

The following changes are compatible in v1:

- Adding an optional request field with a server default.
- Adding a response field.
- Adding an endpoint.
- Adding an optional query parameter.
- Adding an enumeration value if clients have a defined fallback behavior.

## Incompatible Changes

The following changes are not compatible in v1:

- Making an optional request field required.
- Removing or renaming a response field.
- Changing a field type.
- Narrowing an accepted value range.
- Changing the meaning of a field without changing its name.

## Unknown Response Fields

Clients MUST ignore unknown response fields. This allows the service to add response fields without breaking older clients.

## Unknown Enumeration Values

Clients MUST NOT crash when receiving an unknown enumeration value. An unknown workflow status is treated as `in_progress` until the client receives a recognized value.

## Deprecation

Deprecated endpoints or fields are announced using the `Deprecation` header. The planned removal date is announced using the `Sunset` header and documented in the API specification and changelog.
