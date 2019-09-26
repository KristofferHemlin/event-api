import * as jwt from 'jsonwebtoken';

export default (req, res, next) => {

  if(req.method === 'OPTIONS'){
    next();
  }

  // Check for token.
  const token = req.body.token || req.query.token || req.headers['x-access-token'] || req.headers.authorization;

  //If there is a token, try to decode the it.
  if(token){
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if(err){
        return res.send(err)
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
