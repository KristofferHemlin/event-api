import * as jwt from 'jsonwebtoken';

export default (req, res, next) => {

  if(req.method === 'OPTIONS'){
    next();
  }

  // Check for token.
  const bearerToken =  req.headers.authorization; // Bearer {token}

  const [_, token] = bearerToken.split(" "); 


  //If there is a token, try to decode the it.
  if(token){
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if(err){
        return res.status(401).send({message: "Invalid access token."})
      } else {
        req.decoded = decoded
        next();
      }

    })
  } else {
    return res.status(403).send({
      message: 'This route is prohibited, please authenticate and try again.',
    })
  }
}
