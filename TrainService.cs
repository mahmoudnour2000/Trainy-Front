using System;
using System.Collections.Generic;
using System.Diagnostics.Metrics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Trainy.ViewModels;
using TraintFinalProject.Model;
using Trainy.Repositories;
using Trainy.ViewModels;

namespace Trainy.Services
{
    public class TrainService
    {
        private TrainManager trainManager;
        private TrainStationRepository trainStationRepository;
        public TrainService(TrainManager trainManager , TrainStationRepository _trainStationRepository)
        {
            this.trainManager = trainManager;
            trainStationRepository = _trainStationRepository;
        }


        public void Add(TrainCreateModel trainCreateModel)
        {
            trainManager.Add(trainCreateModel.ToModel());
        }

        public List<TrainCreateModel> GetAll()
        {
            var trains = trainManager.GetAll();
            return trains.ToModelList();
        }


        //public TrainCreateModel GetById(int id)
        //{
        //    var trains = trainManager.GetById(id).ToViewModel();
        //    return trains;
        //}

        public TrainStations GetTrainStationById(int id)
        {
            var trainStation = trainStationRepository.GetById(id);
            return trainStation;
        }

        public TraintFinalProject.Model.Train GetById(int id)
        {
            var trains = trainManager.GetById(id);
            return trains;
        }

        public void Update(TrainCreateModel train)
        {
            var OldTrain = trainManager.GetById(train.ID);
            trainManager.Update(train.ToEditModel(OldTrain));
        }
        public void Delete(int id)
        {
            trainManager.HardDelete(id);
        }
    }
}
