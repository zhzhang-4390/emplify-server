FROM node:latest
WORKDIR /emplify-server
COPY package*.json ./
RUN npm install --production
COPY ./ .
ENV NODE_ENV="production"
ENV PORT="80"
ENV DB_CONNECTION="mongodb+srv://zhzhang:F7f7f7f7@emplify-4cnwj.gcp.mongodb.net/emplifydb?retryWrites=true&w=majority"
ENV SESSION_NAME="sid"
ENV SESSION_SECRET="May_The_Odds_Be_Ever_In_Your_Favor"
CMD [ "npm", "start" ]