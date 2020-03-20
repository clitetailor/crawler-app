import prompts from 'prompts'

export async function init() {
  const {
    noDB: { value: noDB }
  } = await prompts({
    type: 'select',
    name: 'noDB',
    message: 'Do you want to use database?',
    choices: [
      { title: 'Yes', value: { value: false } },
      {
        title: 'No, I use filesystem only!',
        value: { value: true }
      }
    ]
  })

  if (!noDB) {
    const { dbms } = await prompts({
      type: 'select',
      name: 'dbms',
      message: 'Which DBMS would you like to use?',
      choices: [
        {
          title: 'PostgreSQL',
          value: {
            dialect: 'postgres',
            username: 'postgres',
            port: 5432
          }
        },
        {
          title: 'MySQL',
          value: { dialect: 'mysql', port: 3306 }
        },
        {
          title: 'MariaDB',
          value: { dialect: 'mariadb', port: 3306 }
        }
      ]
    })

    const database = {
      dialect: dbms.dialect,
      ...(await prompts([
        {
          type: 'text',
          name: 'username',
          message: 'What is your DBMS username?',
          validate: val =>
            val ? true : 'Username is required!'
        },
        {
          type: 'password',
          name: 'password',
          message: 'What is your DBMS password?',
          format: val => (val ? val : null)
        },
        {
          type: 'text',
          name: 'host',
          message: 'What is your DBMS host?',
          initial: '127.0.0.1'
        },
        {
          type: 'number',
          name: 'port',
          message: 'What is your DBMS port?',
          initial: dbms.port
        }
      ]))
    }

    console.log(database)
  }
}

init()
