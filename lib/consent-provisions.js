const _ = require("lodash");
const rp = require("request-promise");

const {
  PURPOSE_OF_USE_SYSTEM,
  PROVISION_TYPE,
  CONSENT_OBLIGATIONS
} = require("./consent-valuesets");

const {
  CONSENT_PERMIT,
  CONSENT_DENY,
  NO_CONSENT
} = require("./consent-decisions");

function matchPurposeOfUse(provision, query) {
  const provisionPurposes = provision.purpose;

  return (
    !provision.purpose ||
    provisionPurposes.some(provisionPurpose =>
      _.isEqual(provisionPurpose, {
        system: PURPOSE_OF_USE_SYSTEM,
        code: query.purposeOfUse
      })
    )
  );
}

async function matchActor(provision, query, fhirServerBase) {
  const provisionActors = provision.actor || [];
  const actorReferencesPromises = provisionActors
    .map(actor => _.get(actor, "reference.reference"))
    .map(actorReference => fetchActor(actorReference, fhirServerBase));

  const actorResources = await Promise.all(actorReferencesPromises);

  const allActorIdentifiers = _.flatten(
    actorResources.map(actorResource => actorResource.identifier)
  );

  const queryActorIds = query.actor;

  const matchingIdentifiers = _.intersectionWith(
    allActorIdentifiers,
    queryActorIds,
    _.isEqual
  );

  return !provision.actor || matchingIdentifiers.length > 0;
}

async function fetchActor(actorReference, fhirBase) {
  const fullUrl = `${fhirBase}${actorReference}`;
  const httpRequest = {
    method: "GET",
    json: true,
    uri: fullUrl
  };
  return rp(httpRequest);
}

async function processProvision(provision, query, fullUrl) {
  if (!provision) {
    return {
      decision: NO_CONSENT,
      obligations: []
    };
  }

  const permit = provision.type === PROVISION_TYPE.PERMIT;
  const matchedActor = await matchActor(
    provision,
    query,
    fhirBaseFromFullResourceUrl(fullUrl)
  );

  const match = matchPurposeOfUse(provision, query) && matchedActor;

  const initialDecision =
    match && permit ? CONSENT_PERMIT : match ? CONSENT_DENY : NO_CONSENT;

  const finalDecision = provision.securityLabel ? NO_CONSENT : initialDecision;

  return {
    decision: finalDecision,
    obligations: securityLabelObligations(initialDecision, provision)
  };
}

function securityLabelObligations(decision, provision) {
  const obligation =
    decision === CONSENT_PERMIT
      ? CONSENT_OBLIGATIONS.SEC_LABELS.ONLY(provision.securityLabel)
      : decision === CONSENT_DENY
      ? CONSENT_OBLIGATIONS.SEC_LABELS.EXCEPT(provision.securityLabel)
      : null;
  
  return provision.securityLabel && obligation ? [obligation] : [];
}

function fhirBaseFromFullResourceUrl(fullUrl) {
  return !fullUrl ? "" : fullUrl.substring(0, fullUrl.indexOf("Consent"));
}

module.exports = {
  processProvision
};