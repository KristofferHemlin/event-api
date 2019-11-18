import {createQueryBuilder, Entity} from 'typeorm';
import User from "../entities/user.entity"
import Activity from 'src/entities/activity.entity';

export function cleanInput(inputObj) {
    let fields = Object.keys(inputObj);

    let cleanedObj = fields.reduce((obj: any, key:string) => {
        obj[key] = inputObj[key].trim();
        if (obj[key] === "") {
            obj[key] = null;
        }
        if (obj[key] === "null") {
            obj[key] = null;
        }
        if (key === "phone") {
            const regEx = new RegExp("[ -]*\\n*", "g");
            if (obj[key]){
                obj[key] = obj[key].replace(regEx, "");
            }
        }
        return obj
    }, {})
    return cleanedObj;
}

export function getPagingResponseMessage(records: User[], totalRecords: number, offset:number, limit:number, reqPath: string) {
    const recordsRemaining = (totalRecords - (limit + offset)) < 0? 0 : (totalRecords - (limit + offset));
    let nextReqPath;
    if (recordsRemaining > 0) {
        const nextOffset = offset + limit;
        if (reqPath.includes("offset=")){
            nextReqPath = reqPath.replace(`offset=${offset}`, `offset=${nextOffset}`);
        } else {
            nextReqPath = reqPath+"&offset="+nextOffset;
        }
    } else {
        nextReqPath = null
    }
      
    return {
        data: records,
        next: nextReqPath,
        remaining: recordsRemaining
    }
}

export function getSortingParams(request): string[] {
    const sortParams = request.query.sort;
    let column, order;
    if (sortParams) {
    [column, order] = sortParams.split(":");
    if (!order){
      order = "ASC";
    }
  } else {
    [column, order] = ["id", "ASC"];  
  }

  return [column, order]
}

export function fetchParticipantBuilder(table: string, id: number, searchValue: string) {
    let queryBuilder = createQueryBuilder(User)
              .innerJoin("User."+table, table, table+".id=:id", {id: id})
    if (searchValue) {
      searchValue = searchValue.toLowerCase();
      queryBuilder
        .where(`LOWER(User.firstName) LIKE :searchParam 
                OR LOWER(User.lastName) LIKE :searchParam 
                OR LOWER(User.companyDepartment) LIKE :searchParam`, {searchParam: `%${searchValue}%`})
    }
    return queryBuilder;
  }

export function updateEntityFields(entity, newValues, possibleInputFields) {
    const updatedUser = possibleInputFields.reduce((entity, field) => {
        if (newValues[field] !== undefined) {
            entity[field] = newValues[field] === "null"? null: newValues[field];
        }
        return entity
      }, entity)

    return updatedUser
}

export function rawToEntity(type, data) {
    const keys = Object.keys(data);
    const newObj = keys.reduce((obj, key) => {
        const entityKey = key.replace(type+"_", "");
        obj[entityKey] = data[key];
        return obj;
    }, {})
    return newObj;
}