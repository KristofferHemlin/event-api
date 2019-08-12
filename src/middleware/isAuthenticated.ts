import * as jwt from 'jsonwebtoken';
import jwtConfig from '../../jwtConfig';

export default (req, res, next) => {

  // Check for token.
  const token = req.body.token || req.query.token || req.headers['x-access-token'] || req.headers.authorization;

  //If there is a token, try to decode the it.
  if(token){
    jwt.verify(token, jwtConfig.secret, (err, decoded) => {
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
