import { useRecoilValue } from "recoil";
import { accessTokenState } from "../atoms/os-maps-atoms";
import { AccessTokenResponse } from "../models/os-maps-models";

export function useApiKey() {

    const accessTokenResponse: AccessTokenResponse = useRecoilValue<AccessTokenResponse>(accessTokenState);
    const key = encodeURI(accessTokenResponse?.access_token);


    return {key};
}

