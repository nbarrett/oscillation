import {log} from "../util/logging-config";
import {
    ApiStatusResponse,
    HTTP_RESPONSE_CODE_HANDLING_DEFAULTS,
    HttpResponseCodeHandling
} from "../models/common-models";

export async function logFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    log.debug("logFetch:input:", input, "init:", init);
    return fetch(input, init);
}

async function returnJsonResponse(response: Response, httpResponseCodeHandling?: HttpResponseCodeHandling) {
    const appliedHttpResponseCodeHandling: HttpResponseCodeHandling = httpResponseCodeHandling || HTTP_RESPONSE_CODE_HANDLING_DEFAULTS;
    if (appliedHttpResponseCodeHandling?.returnNull?.includes(response.status)) {
        return null;
    } else if (appliedHttpResponseCodeHandling?.logWarningReturnNull?.includes(response.status)) {
        log.warn("response", response.status, response.statusText, "received from url", response.url);
        return null;
    } else {
        try {
            try {
                const json = await response.clone().json();
                log.debug("response:", response, "json:", json);
                return response.ok && !json?.error ? json : Promise.reject(json)
            } catch (e) {
                const text = await response.text();
                log.error("non-json response:", response, "text:", text, e);
                const reason: ApiStatusResponse = {error: {message: "non-json response received", exceptionMessage: text, exceptionCauseMessage: response}};
                return Promise.reject(reason)
            }
        } catch (e) {
            log.error("caught error", e, response);
            return Promise.reject({error: e, response})
        }
    }
}

export async function handleTextResponseFor(fetchResponse: Promise<Response>): Promise<Response> {
    return await fetchResponse;
}

export async function handleJSONResponseFor(fetchResponse: Promise<Response>, httpResponseCodeHandling?: HttpResponseCodeHandling): Promise<any> {
    const response: Response = await fetchResponse;
    return returnJsonResponse(response, httpResponseCodeHandling);
}

export async function handleJSONResponseForParameters(input: RequestInfo, init?: RequestInit, httpResponseCodeHandling?: HttpResponseCodeHandling): Promise<any> {
    const response: Response = await logFetch(input, init);
    return returnJsonResponse(response, httpResponseCodeHandling);
}

export async function handleTextResponseForParameters(input: RequestInfo, init?: RequestInit): Promise<string> {
    const response: Response = await logFetch(input, init);
    try {
        const text = await response.text();
        log.debug("text", text, "response", response);
        return response.ok ? text : Promise.reject(text)
    } catch (e) {
        log.error("caught error", e, response);
        return Promise.reject({error: e, response})
    }
}
