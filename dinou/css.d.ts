declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Must stay after "*.module.css" (TS matches equal-prefix wildcards in declaration order)
declare module "*.css" { }