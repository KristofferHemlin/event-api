import {createQueryBuilder} from 'typeorm';
import User from "../entities/user.entity"

export function trimInput(inputObj) {
    let fields = Object.keys(inputObj);

    let trimmedObj = fields.reduce((obj: any, key:string) => {
        obj[key] = inputObj[key].trim();
        if (key === "phone") {
            const regEx = new RegExp("[ -]*\\n*", "g");
            obj[key] = obj[key].replace(regEx, "");
        }
        return obj
    }, {})

    return trimmedObj;
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

export function getSortingParams(request) {
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