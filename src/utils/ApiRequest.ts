/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosResponse } from "axios"
import { Consts } from "./Consts";


export const sendPost = async (url: string, data: any, headers?: any): Promise<AxiosResponse> => {
    const token = localStorage.getItem('access_token');
    console.log('=============?', token);
    return await axios.post(Consts.BASE_URL + url, data, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...headers,
        }
    });
}

export const sendGet = async (url: string, headers?: any): Promise<AxiosResponse> => {
    const token = localStorage.getItem('access_token');
    console.log('=============?', token);
    return await axios.get(Consts.BASE_URL + url, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...headers,
        }
    });
}