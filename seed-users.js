const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const usersFile = path.join(__dirname, 'data', 'users.json');

const usersToCreate = [
  { name: 'Namrata Biradar', email: 'namrata@example.com' },
  { name: 'Prathamesh Giri', email: 'prathamesh@example.com' },
  { name: 'Aditya Desai', email: 'aditya@example.com' },
  { name: 'Pooja Joshi', email: 'pooja@example.com' },
  { name: 'Rohan Kulkarni', email: 'rohan@example.com' }
];

async function seedUsers() {
  const users = [];
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  for (const user of usersToCreate) {
    users.push({
      id: uuidv4(),
      name: user.name,
      email: user.email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    });
  }

  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  console.log('Successfully seeded 5 users.');
}

seedUsers().catch(console.error);
