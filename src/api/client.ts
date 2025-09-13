import {deleteCookie, getCookie} from "cookies-next";
import {TOKEN_NAME} from "@/const/const";

export interface ApiClientOptions {
    withCredentials?: boolean;
    skipToken?: boolean;
    customHeaders?: Record<string, string>;
}


export const apiClient = async <T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
    body?: object | FormData,
    options?: ApiClientOptions
): Promise<T> => {
    const {withCredentials = false, skipToken = false, customHeaders = {}} = options || {};

    let token = getCookie(TOKEN_NAME) as string | null;
    if (skipToken) {
        token = null;
    }

    const isFormData = body instanceof FormData;

    const headers: Record<string, string> = {
        Accept: "application/json",
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
        ...customHeaders,
    };

    if (!isFormData) {
        headers["Content-Type"] = "application/json";
    }

    let requestBody: string | FormData | undefined;
    if (body) {
        requestBody = isFormData ? body : JSON.stringify(body);
    }
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_API}/${endpoint}`, {
        method,
        headers,
        body: requestBody,
        credentials: withCredentials ? "include" : "same-origin",
    });

    if (res.status === 204) {
        return null as T;
    }

    const contentLength = res.headers.get("content-length");
    const contentType = res.headers.get("content-type");

    if (
        contentLength === "0" ||
        (!contentType?.includes("application/json") &&
            !contentType?.includes("text"))
    ) {
        if (res.ok) {
            return null as T;
        }
    }

    let data: any;
    try {
        const text = await res.text();
        if (text.trim() === "") {
            data = res.ok ? null : {message: "Empty response"};
        } else {
            data = JSON.parse(text);
        }
    } catch {
        data = {message: "Invalid response format"};
    }

    if (!res.ok) {
        if (res.status === 401) {
            deleteCookie(TOKEN_NAME);
        }
        throw new Error(data?.message || data?.error || "Something went wrong");
    }

    return data;
}