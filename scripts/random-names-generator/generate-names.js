const faker = require('faker')
const fs = require('fs')

faker.locale = 'de'
faker.seed(256)

const NUM_OF_NAMES = 119204

const names = new Set()
let name
while (names.size < NUM_OF_NAMES) {
  name = faker.fake('{{internet.userName}}\n')
  if (name.length <= 14) {
    names.add(name)
  }
}

const file = fs.createWriteStream('random_names.csv')
file.on('error', err => console.log(err))
names.forEach(n => file.write(n))
file.end()
