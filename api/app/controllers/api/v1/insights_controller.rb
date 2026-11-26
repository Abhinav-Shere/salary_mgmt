module Api
  module V1
    class InsightsController < ApplicationController
      def summary
        render json: insights.summary
      end

      def countries
        render json: { countries: insights.countries }
      end

      def country
        render json: insights.country(params.require(:country))
      end

      def job_title
        render json: insights.job_title(country: params.require(:country), job_title: params.require(:job_title))
      end

      private

      def insights
        SalaryInsights.new
      end
    end
  end
end
