module Api
  module V1
    class EmployeesController < ApplicationController
      before_action :set_employee, only: %i[show update destroy]

      def index
        employees = Employee.filtered(query: params[:q], country: params[:country], job_title: params[:job_title])
        pagination = Pagination.new(employees.order(:full_name, :id), page: params[:page], per_page: params[:per_page])

        render json: { employees: pagination.records, meta: pagination.meta }
      end

      def show
        render json: @employee
      end

      def create
        employee = Employee.new(employee_params)

        if employee.save
          render json: employee, status: :created
        else
          render_validation_errors(employee)
        end
      end

      def update
        if @employee.update(employee_params)
          render json: @employee
        else
          render_validation_errors(@employee)
        end
      end

      def destroy
        @employee.destroy!
        head :no_content
      end

      private

      def set_employee
        @employee = Employee.find(params[:id])
      end

      def employee_params
        params.expect(employee: %i[full_name job_title country department salary email hire_date])
      end
    end
  end
end
