Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  root "endpoints#index"
  get "api" => "endpoints#index"
  get "api/v1" => "endpoints#index"

  namespace :api do
    namespace :v1 do
      resources :employees, only: %i[index show create update destroy]
      resource :lookups, only: :show

      scope :insights, controller: :insights, as: :insights do
        get :summary
        get :countries
        get :country
        get :job_title
      end
    end
  end

  match "*path", to: "endpoints#not_found", via: :all
end
