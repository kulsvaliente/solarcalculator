# Dockerfile for React client


FROM nginx:alpine AS prod

WORKDIR /usr/share/nginx/html

# Build-time args with sensible defaults
ARG REACT_APP_API_URL=https://arecgis-api.nbericmmsu.com
ARG REACT_APP_IMAGE_BASE_URL=https://arecgis-api.nbericmmsu.com/image/
ARG REACT_APP_OWM_KEY=***REMOVED***
ARG REACT_APP_GROQ_API_KEY=***REMOVED***
ARG REACT_APP_EMAILJS_PUBLIC_KEY=***REMOVED***
ARG REACT_APP_EMAILJS_TEMPLATE_ID=***REMOVED***
ARG REACT_APP_EMAILJS_SERVICE_ID=***REMOVED***

# Runtime env exported into the container
ENV NODE_ENV=production \
    REACT_APP_API_URL=${REACT_APP_API_URL} \
    REACT_APP_IMAGE_BASE_URL=${REACT_APP_IMAGE_BASE_URL} \
    REACT_APP_OWM_KEY=***REMOVED*** \
    REACT_APP_GROQ_API_KEY=***REMOVED*** \
    REACT_APP_EMAILJS_PUBLIC_KEY=***REMOVED*** \
    REACT_APP_EMAILJS_TEMPLATE_ID=***REMOVED*** \
    REACT_APP_EMAILJS_SERVICE_ID=***REMOVED***

COPY build/ .
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]