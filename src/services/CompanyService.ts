import CompanyModel from "../models/CompanyModel";
import ServerError from "../types/errors/ServerError";
import UserModel from "../models/UserModel";
import {validateFields, createErrorMessage} from "../modules/validation";
import Company from "../entities/company.entity";
import InputNotValidError from "../types/errors/InputNotValidError";

export default class CompanyService {
    companyModel = new CompanyModel();
    userModel = new UserModel();

    async getCompanies(){
        return this.companyModel.getAllCompanies(['employees', 'events', 'activities']).catch(() => {
            throw new ServerError("Could not fetch companies");
        })
    }
    
    async getCompanyById(companyId: number) {
        return this.companyModel.getCompanyById(companyId).catch(() => {
            throw new ServerError("Could not fetch company");
        })
    }

    async getCompanyEvents(companyId: number) {
        return this.companyModel.getCompanyEvents(companyId).catch(() => {
            throw new ServerError("Could not fetch company events");
        })
    }

    async getCompanyEmployees(companyId: number) {
        return this.userModel.getUsersOn("company", companyId, [], "firstName", "asc").catch(() => {
            throw new ServerError("Could not fetch company employees");
        })
    }

    async createCompany(companyData) {
        let company = new Company();
        const [inputValid, errorInfo] = validateFields(companyData, ["title"]);
        if (!inputValid) {
            const errorMessage = createErrorMessage(errorInfo);
            throw new InputNotValidError(errorMessage);
        }
        company.title = companyData.title;
        return this.companyModel.saveCompany(company).catch(() => {
            throw new ServerError("Could not create new company");
        });
    }

    async updateCompany(companyId: number, companyData) {
        const companyToUpdate = await this.companyModel.getCompanyById(companyId);
        let [inputValid, errorInfo] = validateFields(companyData, ["title"]);

        if (!inputValid) {
            const errorMessage = createErrorMessage(errorInfo);
            throw new InputNotValidError(errorMessage);
        }
        companyToUpdate.title = companyData.title;
        return this.companyModel.saveCompany(companyToUpdate).catch(() => {
            throw new ServerError("Could not update company");
        })
    }

    async deleteCompany(companyId) {
        return this.companyModel.deleteCompany(companyId).catch(error => {
            throw new ServerError("Could not delete company");
        })
    }
}