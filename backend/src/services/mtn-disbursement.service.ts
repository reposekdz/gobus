import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface MTNDisbursementConfig {
  baseUrl: string;
  subscriptionKey: string;
  apiUserId: string;
  apiKey: string;
  targetEnvironment: string;
}

interface DepositRequest {
  amount: string;
  currency: string;
  externalId: string;
  payee: {
    partyIdType: string;
    partyId: string;
  };
  payerMessage: string;
  payeeNote: string;
}

interface TransferRequest {
  amount: string;
  currency: string;
  externalId: string;
  payee: {
    partyIdType: string;
    partyId: string;
  };
  payerMessage: string;
  payeeNote: string;
}

export class MTNDisbursementService {
  private config: MTNDisbursementConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.config = {
      baseUrl: 'https://sandbox.momodeveloper.mtn.com/disbursement',
      subscriptionKey: 'a34dd9b3f5b74e729fddf3cf47941795',
      apiUserId: 'gobus',
      apiKey: '6ff111de84b5464492ce970caf16fa30',
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
      throw new Error(`Failed to get disbursement access token: ${error.response?.data?.message || error.message}`);
    }
  }

  async deposit(request: DepositRequest): Promise<string> {
    const token = await this.getAccessToken();
    const referenceId = uuidv4();

    try {
      await axios.post(
        `${this.config.baseUrl}/v1_0/deposit`,
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
      throw new Error(`Deposit request failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getDepositStatus(referenceId: string): Promise<any> {
    const token = await this.getAccessToken();

    try {
      const response = await axios.get(
        `${this.config.baseUrl}/v1_0/deposit/${referenceId}`,
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
      throw new Error(`Failed to get deposit status: ${error.response?.data?.message || error.message}`);
    }
  }

  async transfer(request: TransferRequest): Promise<string> {
    const token = await this.getAccessToken();
    const referenceId = uuidv4();

    try {
      await axios.post(
        `${this.config.baseUrl}/v1_0/transfer`,
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
      throw new Error(`Transfer request failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getTransferStatus(referenceId: string): Promise<any> {
    const token = await this.getAccessToken();

    try {
      const response = await axios.get(
        `${this.config.baseUrl}/v1_0/transfer/${referenceId}`,
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
      throw new Error(`Failed to get transfer status: ${error.response?.data?.message || error.message}`);
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
      throw new Error(`Failed to get disbursement account balance: ${error.response?.data?.message || error.message}`);
    }
  }

  async refund(amount: string, currency: string, externalId: string, payeePhone: string, reason: string): Promise<string> {
    const token = await this.getAccessToken();
    const referenceId = uuidv4();

    try {
      const refundData = {
        amount,
        currency,
        externalId,
        payee: {
          partyIdType: 'MSISDN',
          partyId: payeePhone
        },
        payerMessage: `Refund: ${reason}`,
        payeeNote: `GoBus refund for transaction ${externalId}`
      };

      await axios.post(
        `${this.config.baseUrl}/v1_0/refund`,
        refundData,
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
      throw new Error(`Refund request failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getRefundStatus(referenceId: string): Promise<any> {
    const token = await this.getAccessToken();

    try {
      const response = await axios.get(
        `${this.config.baseUrl}/v1_0/refund/${referenceId}`,
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
      throw new Error(`Failed to get refund status: ${error.response?.data?.message || error.message}`);
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
}