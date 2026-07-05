import { getContext } from "./core/request-context.js";
import {
  usePathname,
  useSearchParams,
  useRouter,
  useNavigationLoading,
} from "./core/navigation.js";
import { redirect } from "./core/redirect.jsx";
import { ClientRedirect } from "./core/client-redirect.jsx";
import { Link } from "./core/link.jsx";

const dinou = {
  getContext,
  usePathname,
  useSearchParams,
  useRouter,
  useNavigationLoading,
  redirect,
  ClientRedirect,
  Link,
};

export {
  getContext,
  usePathname,
  useSearchParams,
  useRouter,
  useNavigationLoading,
  redirect,
  ClientRedirect,
  Link,
};

export default dinou;
