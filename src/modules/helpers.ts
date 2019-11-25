import {createQueryBuilder, Entity} from 'typeorm';
import User from "../entities/user.entity"
import * as fs from 'fs';
import {ImageType} from "../types/ImageType";

export function cleanInput(inputObj) {
  let fields = Object.keys(inputObj);

  let cleanedObj = fields.reduce((obj: any, key:string) => {
    if (!key.toLowerCase().includes("password")) {
      obj[key] = inputObj[key].trim();
    } else {
      obj[key] = inputObj[key];
    }
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

export function deselectFields(entity, fieldsToRemove) {
    const newEntity = fieldsToRemove.reduce((map, field) => {
        delete map[field];
        return map;
    }, {...entity});   
  return newEntity;
}

export function removeFileFromPath(path){
  if (path) {
    try {
    fs.unlinkSync(path);
    } catch (error) {
      console.error("Could not remove file:", path);
    }
  }
}
  
export function removeFile(file){
  if (file) {
    const path = file.path;
    removeFileFromPath(path);
  }
};

export function removeAllFiles(filePaths: string[]) {
  filePaths.map(filePath => {
    removeFileFromPath(filePath);
  })
}

export function removeImages(savedPath) {
  // The saved path looks like mimetype:path
  if (savedPath) {
    const path = savedPath.split(":")[1];
    const filesToRemove = [path, path.replace(ImageType.COMPRESSED, ImageType.MINIATURE)]
    removeAllFiles(filesToRemove);
  }
}

export function getDataUrl(imageUrl, imageType?: ImageType) {
  if(imageUrl){
    if (imageType) {
      imageUrl = imageUrl.replace(ImageType.COMPRESSED, imageType);
    }
    let encoding = 'base64';
    let [mimeType, imagePath] = imageUrl.split(':');
    try {
      let imageString = fs.readFileSync(imagePath, encoding);
      return "data:" + mimeType + ";"+encoding+"," + imageString;
    } catch (error){
      console.error("Could not read file", imagePath)
      return null;
    }
  }
  return imageUrl;
}