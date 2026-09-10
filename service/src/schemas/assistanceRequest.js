// service/src/schemas/assistanceRequests.js
// Validation rules derived from openapi.yaml components/schemas/AssistanceRequest
// and POST /assistance-requests requestBody.

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Derived from POST /v1/assistance-requests requestBody in openapi.yaml
const createAssistanceRequestSchema = {
  type: 'object',
  required: ['applicantNationalId', 'applicantName', 'familyMemberCount', 'targetLocation', 'requiredPackageType'],
  properties: {
    applicantNationalId: { type: 'string' },
    applicantName:       { type: 'string' },
    familyMemberCount:   { type: 'integer', minimum: 1 },
    targetLocation:      { type: 'string' },
    requiredPackageType: { type: 'string', enum: ['family_food_pack', 'medical_emergency_kit', 'baby_essentials'] },
  },
  additionalProperties: false,
};

// Query parameter validation for GET /v1/assistance-requests
const listQuerySchema = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['submitted', 'approved', 'rejected', 'allocated', 'completed', 'cancelled'] },
    urgency: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    cursor: { type: 'string' },
    limit:  { type: 'integer', minimum: 1, maximum: 100, default: 20 },
  },
  additionalProperties: false,
};

const validateCreate = ajv.compile(createAssistanceRequestSchema);
const validateListQuery = ajv.compile(listQuerySchema);

module.exports = { validateCreate, validateListQuery };
