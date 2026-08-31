import axios, { AxiosInstance } from "axios";

const POLICY_API_URL = "http://localhost:3030";

export interface Policy {
  policyId: string;
  customerName: string;
  policyType: string;
  sumInsured: number;
  premium: number;
  status: string;
}

export interface PoliciesResponse {
  success: boolean;
  data: Policy[];
}

const policyApi: AxiosInstance = axios.create({
  baseURL: POLICY_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const policyService = {
  getPolicies: async () => policyApi.get<PoliciesResponse>("/policies"),
};

export default policyService;
