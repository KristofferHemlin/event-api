export function trimInput(inputObj) {
    let fields = Object.keys(inputObj);

    let trimmedObj = fields.reduce((obj: any, key:string) => {
        obj[key] = inputObj[key].trim();
        return obj
    }, {})

    return trimmedObj;
}