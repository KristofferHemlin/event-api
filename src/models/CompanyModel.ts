import { getRepository} from 'typeorm';

import Company from '../entities/company.entity';
import Event from '../entities/event.entity';
import Activity from '../entities/activity.entity';

export default class CompanyModel {

    getAllCompanies(additionalRelations: string[]=[]): Promise<Company[]> {
        return getRepository(Company).find({relations: additionalRelations, order: {id: "ASC"}})
        .then(companies => {
            return companies;
        })
        .catch(error => {
            console.error("Error while fetching companies:", error)
            return Promise.reject(error);
        })
    }

    getCompanyById(companyId: number, additionalRelations: string[]=[]): Promise<Company>{
        return getRepository(Company).findOne({ id: companyId }, {relations: additionalRelations})
            .then(company => {
                return company;
            })
            .catch(error => {
            console.error("Error while fetching company:", error);
            return Promise.reject(error);
            })
    }

    getCompanyEvents(companyId: number): Promise<Event[]> {
        return getRepository(Event).createQueryBuilder()
            .innerJoinAndSelect("Event.company", "company")
            .where("Event.company.id = :companyId", { companyId: companyId })
            .orderBy("Event.id", "ASC")
            .getMany()
            .then(events => {
                return events;
            })
            .catch(error => {
            console.error("Error while fetching company events:", error);
            return Promise.reject(error);
            })
    }

    getCompanyActivities(companyId: number): Promise<Activity[]> {
        return getRepository(Activity).createQueryBuilder()
            .innerJoin("Activity.event", "event")
            .innerJoin("event.company", "company")
            .where("company.id=:companyId", {companyId: companyId})
            .getMany()
            .catch(error => {
                console.log("Error while fetching company activities")
                return Promise.reject(error);
            });
    }

    saveCompany(company: Company): Promise<Company> {
        return getRepository(Company).save(company)
            .then(savedCompany => {
                return savedCompany
            }).catch(error => {
                console.error("Error while creating new company:", error);
                return Promise.reject(error);
        })
    }

    deleteCompany(companyId: number): Promise<void> {
        return getRepository(Company).delete({id: companyId}).then(response => {
            return;
        }).catch(error => {
            console.error("Error while deleting company:", error)
            return Promise.reject(error);
        })
    }

}