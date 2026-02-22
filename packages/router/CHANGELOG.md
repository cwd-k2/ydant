# @ydant/router

## 0.3.0

### Breaking Changes

- **RouterLink**: `children` prop renamed to `content` for consistency with other components
- **RouteInfo.params removed**: Path params now passed as props via `RouteComponentProps`

### Improvements

- Global state eliminated: `window.location` derived on each call
- DOM custom events (`ydant:route-change`) replace module-level listener sets
- Multi-entry ES+CJS build

## 0.2.0

### Improvements

- All JSDoc and inline comments rewritten to English
