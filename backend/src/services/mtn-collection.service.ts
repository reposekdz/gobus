import axios, { AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface MTNCollectionConfig {
  baseUrl: string;
  subscriptionKey: string;
  apiUserId: string;
  apiKey: string;
  targetEnvironment: string;
}

interface RequestToPayRequest {
  amount: string;
  currency: string;
  externalId: string;
  payer: {
    partyIdType: string;
    partyId: string;
  };
  payerMessage: string;
  payeeNote: string;
}

interface PaymentStatus {
  amount: string;
  currency: string;
  financialTransactionId: string;
  externalId: string;
  payer: {
    partyIdType: string;
    partyId: string;
  };
  status: string;
  reason?: string;
}

export class MTNCollectionService {
  private config: MTNCollectionConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.config = {
      baseUrl: 'https://sandbox.momodeveloper.mtn.com/collection',
      subscriptionKey: '8c1c562bfbe241458e3b0bdc4d05d40e',
      apiUserId: 'gobus',
      apiKey: '13b6baa354c044f9a0159b74642b7791',
      targetEnvironment: 'sandbox'
    };
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const credentials = Buffer.from(`${this.config.apiUserId}:${this.config.apiKey}`).toString('base64');
      
      const response = await axios.post(
        `${this.config.baseUrl}/token/`,
        {},
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
            'X-Target-Environment': this.config.targetEnvironment
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));
      
      return this.accessToken!;
    } catch (error: any) {
      throw new Error(`Failed to get access token: ${error.response?.data?.message || error.message}`);
    }
  }

  async requestToPay(request: RequestToPayRequest): Promise<string> {
    const token = await this.getAccessToken();
    const referenceId = uuidv4();

    try {
      await axios.post(
        `${this.config.baseUrl}/v1_0/requesttopay`,
        request,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Reference-Id': referenceId,
            'X-Target-Environment': this.config.targetEnvironment,
            'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return referenceId;
    } catch (error: any) {
      throw new Error(`Payment request failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getPaymentStatus(referenceId: string): Promise<PaymentStatus> {
    const token = await this.getAccessToken();

    try {
      const response = await axios.get(
        `${this.config.baseUrl}/v1_0/requesttopay/${referenceId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Target-Environment': this.config.targetEnvironment,
            'Ocp-Apim-Subscription-Key': this.config.subscriptionKey
          }
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get payment status: ${error.response?.data?.message || error.message}`);
    }
  }

  async getAccountBalance(currency: string = 'RWF'): Promise<{ availableBalance: string; currency: string }> {
    const token = await this.getAccessToken();

    try {
      const response = await axios.get(
        `${this.config.baseUrl}/v1_0/account/balance/${currency}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Target-Environment': this.config.targetEnvironment,
            'Ocp-Apim-Subscription-Key': this.config.subscriptionKey
          }
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get account balance: ${error.response?.data?.message || error.message}`);
    }
  }

  async validateAccountHolder(phoneNumber: string): Promise<boolean> {
    const token = await this.getAccessToken();

    try {
      await axios.get(
        `${this.config.baseUrl}/v1_0/accountholder/msisdn/${phoneNumber}/active`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Target-Environment': this.config.targetEnvironment,
            'Ocp-Apim-Subscription-Key': this.config.subscriptionKey
          }
        }
      );

      return true;
    } catch (error: any) {
      return false;
    }
  }

  async createInvoice(amount: string, currency: string, description: string): Promise<string> {
    const token = await this.getAccessToken();
    const referenceId = uuidv4();

    try {
      const invoiceData = {
        amount,
        currency,
        description,
        externalId: referenceId,
        validityDuration: 3600 // 1 hour
      };

      await axios.post(
        `${this.config.baseUrl}/v2_0/invoice`,
        invoiceData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Reference-Id': referenceId,
            'X-Target-Environment': this.config.targetEnvironment,
            'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return referenceId;
    } catch (error: any) {
      throw new Error(`Invoice creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getInvoiceStatus(referenceId: string): Promise<any> {
    const token = await this.getAccessToken();

    try {
      const response = await axios.get(
        `${this.config.baseUrl}/v2_0/invoice/${referenceId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Target-Environment': this.config.targetEnvironment,
            'Ocp-Apim-Subscription-Key': this.config.subscriptionKey
          }
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get invoice status: ${error.response?.data?.message || error.message}`);
    }
  }
}