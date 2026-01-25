export interface Post {
  id: number;
  title: string;
  body: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  company: {
    name: string;
  };
}
