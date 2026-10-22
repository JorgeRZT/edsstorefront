import { getCookie } from '@dropins/tools/lib.js';
import * as authApi from '@dropins/storefront-auth/api.js';
import { render as authRenderer } from '@dropins/storefront-auth/render.js';
import { SignIn } from '@dropins/storefront-auth/containers/SignIn.js';
import {
  CUSTOMER_FORGOTPASSWORD_PATH,
  rootLink,
} from '../../scripts/commerce.js';

function handleLogout(redirections) {
  const shouldRedirect = Object.entries(redirections).some(([currentPath, redirectPath]) => {
    if (window.location.pathname.includes(currentPath)) {
      window.location.href = redirectPath;
      return true;
    }
    return false;
  });

  if (!shouldRedirect) {
    // reload the page if no redirect occurred
    window.location.reload();
  }
}

function renderSignIn(element) {
  authRenderer.render(SignIn, {
    onSuccessCallback: () => {
      // reload the page
      window.location.reload();
    },
    formSize: 'small',
    routeForgotPassword: () => rootLink(CUSTOMER_FORGOTPASSWORD_PATH),
  })(element);
}

/**
 * Renders the account dropdown (sign in / account menu)
 * @param {Element} navTools The nav tools container
 * @param {Object} [options]
 * @param {string} [options.label] Visible label for the account button (e.g. "Cuenta")
 * @param {string} [options.icon] Icon URL for the account button
 */
export function renderAuthDropdown(navTools, options = {}) {
  const { label, icon } = options;
  const dropdownElement = document.createRange().createContextualFragment(`
 <div class="dropdown-wrapper nav-tools-wrapper">
    <button type="button" class="nav-dropdown-button" aria-haspopup="dialog" aria-expanded="false" aria-controls="login-modal"></button>
    <div class="nav-auth-menu-panel nav-tools-panel">
      <div id="auth-dropin-container"></div>
      <ul class="authenticated-user-menu">
         <li><a href="${rootLink('/customer/account')}">My Account</a></li>
          <li><button>Logout</button></li>
      </ul>
    </div>
 </div>`);

  navTools.append(dropdownElement);

  const authDropDownPanel = navTools.querySelector('.nav-auth-menu-panel');
  const authDropDownMenuList = navTools.querySelector(
    '.authenticated-user-menu',
  );
  const authDropinContainer = navTools.querySelector('#auth-dropin-container');
  const loginButton = navTools.querySelector('.nav-dropdown-button');
  const logoutButtonElement = navTools.querySelector(
    '.authenticated-user-menu > li > button',
  );

  authDropDownPanel.addEventListener('click', (e) => e.stopPropagation());

  async function toggleDropDownAuthMenu(state) {
    const show = state ?? !authDropDownPanel.classList.contains('nav-tools-panel--show');

    authDropDownPanel.classList.toggle('nav-tools-panel--show', show);
    authDropDownPanel.setAttribute('role', 'dialog');
    authDropDownPanel.setAttribute('aria-hidden', 'false');
    authDropDownPanel.setAttribute('aria-labelledby', 'modal-title');
    authDropDownPanel.setAttribute('aria-describedby', 'modal-description');
    loginButton.setAttribute('aria-expanded', show ? 'true' : 'false');
    authDropDownPanel.focus();
  }

  loginButton.addEventListener('click', () => toggleDropDownAuthMenu());
  document.addEventListener('click', async (e) => {
    const clickOnDropDownPanel = authDropDownPanel.contains(e.target);
    const clickOnLoginButton = loginButton.contains(e.target);

    if (!clickOnDropDownPanel && !clickOnLoginButton) {
      await toggleDropDownAuthMenu(false);
    }
  });

  logoutButtonElement.addEventListener('click', async () => {
    await authApi.revokeCustomerToken();
    handleLogout({
      '/checkout': rootLink('/cart'),
      '/customer': rootLink('/customer/login'),
      '/order-details': rootLink('/'),
    });
  });

  renderSignIn(authDropinContainer);

  const updateDropDownUI = (isAuthenticated) => {
    const getUserTokenCookie = getCookie('auth_dropin_user_token');
    const getUserNameCookie = getCookie('auth_dropin_firstname');

    if (isAuthenticated || getUserTokenCookie) {
      authDropDownMenuList.style.display = 'block';
      authDropinContainer.style.display = 'none';
      if (icon) {
        loginButton.innerHTML = `<img src="${icon}" alt="" width="24" height="24" loading="lazy"><span class="nav-tools-label"></span>`;
        loginButton.querySelector('.nav-tools-label').textContent = `Hi, ${getUserNameCookie}`;
      } else {
        loginButton.textContent = `Hi, ${getUserNameCookie}`;
      }
    } else {
      authDropDownMenuList.style.display = 'none';
      authDropinContainer.style.display = 'block';
      if (icon) {
        loginButton.innerHTML = `<img src="${icon}" alt="" width="24" height="24" loading="lazy"><span class="nav-tools-label"></span>`;
        loginButton.querySelector('.nav-tools-label').textContent = label || 'My Account';
        loginButton.setAttribute('aria-label', label || 'My Account');
        return;
      }
      loginButton.innerHTML = `
      <svg
          width="25"
          height="25"
          viewBox="0 0 24 24"
          aria-label="My Account"
          >
          <g fill="none" stroke="#000000" stroke-width="1.5">
          <circle cx="12" cy="6" r="4"></circle>
          <path d="M20 17.5c0 2.485 0 4.5-8 4.5s-8-2.015-8-4.5S7.582 13 12 13s8 2.015 8 4.5Z"></path></g></svg>
        `;
    }
  };

  updateDropDownUI();
}
