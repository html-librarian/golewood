<template>
  <div class="flex min-h-screen flex-col public-page">
    <LayoutSettingsBar />
    <main class="mobile-nav-offset flex-1">
      <slot />
    </main>
    <LayoutAppFooter />
    <LayoutMobileNav />
    <LegalCookieConsent />
    <UiBackToTop />
  </div>
</template>
