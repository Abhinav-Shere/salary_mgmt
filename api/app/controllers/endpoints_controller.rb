class EndpointsController < ApplicationController
  def index
    render json: { endpoints: api_routes }
  end

  def not_found
    render json: { error: "No route matches #{request.method} #{request.path}" }, status: :not_found
  end

  private

  def api_routes
    Rails.application.routes.routes.filter_map do |route|
      path = route.path.spec.to_s.delete_suffix("(.:format)")
      "#{route.verb} #{path}" if path.start_with?("/api/v1/")
    end
  end
end
