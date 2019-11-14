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
        if (!reqPath.includes("limit=")) {
            nextReqPath += "&limit="+limit;
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