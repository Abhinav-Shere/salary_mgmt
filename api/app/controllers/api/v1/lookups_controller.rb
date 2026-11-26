module Api
  module V1
    class LookupsController < ApplicationController
      def show
        render json: {
          countries: Employee::COUNTRIES,
          departments: Employee::DEPARTMENTS,
          job_titles: Employee.distinct.order(:job_title).pluck(:job_title)
        }
      end
    end
  end
end
