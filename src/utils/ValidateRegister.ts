import { RegisterInput } from "../resolvers/RegisterInput";

const validateRegister = (options: RegisterInput) => {
  if (!options.email.includes("@")) {
    return [
      {
        field: "email",
        message: "invalid email",
      },
    ];
  }

  if (options.username.length <= 6) {
    return [
      {
        field: "username",
        message: "length must be greater than 6",
      },
    ];
  }

  if (options.username.includes("@")) {
    return [
      {
        field: "username",
        message: "cannot include an @",
      },
    ];
  }

  if (options.password.length <= 6) {
    return [
      {
        field: "password",
        message: "length must be greater than 6",
      },
    ];
  }

  return null;
};

export default validateRegister;
