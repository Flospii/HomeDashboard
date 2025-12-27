export default defineAppConfig({
  // https://ui.nuxt.com/getting-started/theme#design-system
  ui: {
    colors: {
      primary: "emerald",
      neutral: "slate",
    },
    button: {
      defaultVariants: {
        // Set default button color to neutral
        // color: 'neutral'
      },
    },
    card: {
      variants: {
        variant: {
          glass: {
            root: "bg-(--ui-bg)/70 backdrop-blur-md border border-(--ui-border) shadow-xl",
          },
          glassDark: {
            root: "bg-(--ui-bg)/80 backdrop-blur-md border border-(--ui-border) shadow-2xl",
          },
        },
      },
    },
  },
});
