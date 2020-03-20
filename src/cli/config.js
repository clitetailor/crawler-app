import * as yup from 'yup'

const schema = yup.object({
  version: yup.string(),
  noDB: yup.boolean(),
  database: yup.mixed().when(['noDB'], {
    is: false,
    then: yup
      .object()
      .shape({
        dialect: yup.string().required(),
        username: yup.string().required(),
        password: yup.string().notRequired(),
        host: yup.string(),
        port: yup.oneOf([
          yup.string().matches(/[0-9]+/),
          yup.number()
        ])
      })
      .required()
  })
})

export function validate(config) {
  return schema.validate(config)
}

export async function main(config) {
  try {
    const result = await validate({
      version: '5.0.0',
      noDB: false,
      database: {

      }
    })

    console.log(result)
  } catch (error) {
    console.log(error.errors[0])
  }
}

main()
