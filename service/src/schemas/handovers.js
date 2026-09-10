const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const createHandoverSchema = {
  type: 'object',
  required: ['distributionId', 'recipientNationalId', 'handedOverAt', 'fieldOfficerId'],
  properties: {
    distributionId:       { type: 'string' },
    recipientNationalId:  { type: 'string' },
    handedOverAt:         { type: 'string', format: 'date-time' },
    fieldOfficerId:       { type: 'string' },
    recipientNotes:       { type: ['string', 'null'] },
  },
  additionalProperties: false,
};

const validateCreate = ajv.compile(createHandoverSchema);
module.exports = { validateCreate };
