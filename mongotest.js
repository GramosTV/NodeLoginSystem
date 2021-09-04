const bcrypt = require('bcrypt');
(async () => {
 const result = await bcrypt.compare('www', '$2b$10$ogMxOcvWZ/aGkGMRAaiuqehrkESp73AFeEQhUfX/ALwmxdZtKklJO')
 console.log(result)
})()
