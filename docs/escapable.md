# Escapable

Components that are escapable through the `escape` input action (typically the Esc key) contain DOM elements containing the cascading class indicated by the `ESCAPABLE` constant in `com.sweaxizone.metro/utils`.

If you need to check whether an element is escapable (i.e. there are no other nested escapable containers open), use the `escapable(element)` function from `com.sweaxizone.metro/utils`.