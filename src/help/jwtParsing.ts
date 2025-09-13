import {jwtDecode} from "jwt-decode";

export const secondsUntilExpire = (jwt: string, skew: number) => {
    const {exp} = jwtDecode<{ exp: number }>(jwt);
    const nowSeconds = Math.floor((Date.now()) / 1000)
    return Math.max(exp - skew - nowSeconds, 0);
}

export const getSubject = (jwt: string): string => {
    const { sub } = jwtDecode<{ sub: string }>(jwt);
    return sub;
};