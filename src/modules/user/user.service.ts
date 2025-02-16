import { Injectable, NotAcceptableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDTO } from './dto/createUser.dto';
import * as Bcrypt from 'bcrypt';
import { Store } from 'src/entities/store.entity';
import { Experience } from 'src/entities/experience.entity';
import { ApplyJobDTO } from './dto/applyJob.dto';
import { Jobpost } from 'src/entities/jobpost.entity';
import { ApplicationDocuments } from '../../entities/applicationdocuments.entity';
import { CreateDocumentsDTO } from './dto/createDocuments.dto';
import e from 'express';
import { UpdateDocumentsDTO } from './dto/updateDocuments.dto';
import { CreateScheduleDTO } from './dto/createSchedule.dto';
import { Schedule } from '../../entities/schedule.entity';
import { UpdateScheduleDTO } from './dto/updateSchedule.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Store)
    private storeRepository: Repository<Store>,

    @InjectRepository(Experience)
    private expRepository: Repository<Experience>,

    @InjectRepository(Jobpost)
    private jobpostRepository: Repository<Jobpost>,

    @InjectRepository(ApplicationDocuments)
    private applicationDocumentsRepository: Repository<ApplicationDocuments>,

    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
  ) {
    this.userRepository = userRepository;
    this.storeRepository = storeRepository;
    this.expRepository = expRepository;
    this.jobpostRepository = jobpostRepository;
    this.applicationDocumentsRepository = applicationDocumentsRepository;
    this.scheduleRepository = scheduleRepository;
  }

  async getByUserId(userId: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ userId });
      if (user) {
        return user;
      }
    } catch (err) {
      throw err;
    }
  }

  async createUser(createUserDto: CreateUserDTO): Promise<void> {
    try {
      const { userId, pwd, email, phoneNumber, name, birth } = createUserDto;
      const hashPwd: string = await Bcrypt.hash(pwd, 12);

      await this.userRepository.save({
        userId,
        pwd: hashPwd,
        email,
        phoneNumber,
        name,
        birth,
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async applyJob(postId: number, applyJobDto: ApplyJobDTO) {
    try {
      const { userId, storeId } = applyJobDto;

      const user = await this.userRepository.findOne({ userId });
      const jobpost = await this.jobpostRepository.findOne({ id: postId });
      const experience = await this.expRepository.findOne({ user, jobpost });

      if (experience) {
        return '이미 신청한 공고입니다.';
      }

      const store = await this.storeRepository.findOne({ id: storeId });

      if (store && user) {
        this.expRepository.save({
          result: 2,
          store,
          user,
          jobpost,
        });
      }
    } catch (err) {
      throw err;
    }
  }

  async deleteApplication(userId: string, postId: number) {
    try {
      const jobpost = await this.jobpostRepository.findOne({ id: postId });
      const user = await this.userRepository.findOne({ userId });
      const application = await this.expRepository.findOne({ jobpost, user });
      if (application) {
        await this.expRepository.delete(application);
      }
    } catch (err) {
      throw err;
    }
  }

  async getApplyList(userId: string) {
    try {
      const user = await this.userRepository.findOne({ userId });
      const applyList = await this.expRepository.find({ user });
      return applyList;
    } catch (err) {
      throw err;
    }
  }

  async createApplicationDocuments(
    userId: string,
    createDocumentsDto: CreateDocumentsDTO,
  ) {
    try {
      const { title, content } = createDocumentsDto;

      const user = await this.userRepository.findOne({ userId });
      if (user) {
        const applicationDocuments =
          await this.applicationDocumentsRepository.findOne({ user });

        if (applicationDocuments) {
          throw new NotAcceptableException('already create documents');
        }

        this.applicationDocumentsRepository.save({
          title,
          content,
          user,
        });
      } else {
        throw new NotAcceptableException('not existed user');
      }
    } catch (err) {
      throw err;
    }
  }

  async updateApplicationDocuments(
    userId: string,
    updateDocumentsDto: UpdateDocumentsDTO,
  ) {
    try {
      const user = await this.userRepository.findOne({ userId });

      if (user) {
        const applicationDocuments =
          await this.applicationDocumentsRepository.findOne({ user });

        if (!applicationDocuments) {
          throw new NotAcceptableException('not existed applicationDocuments');
        }

        this.applicationDocumentsRepository.update(applicationDocuments, {
          updatedAt: new Date(),
          ...updateDocumentsDto,
        });
      } else {
        throw new NotAcceptableException('not existed user');
      }
    } catch (err) {
      throw err;
    }
  }

  async getApplicationDocuments(userId: string) {
    try {
      const user = await this.userRepository.findOne({ userId });

      if (user) {
        const applicationDocuments =
          await this.applicationDocumentsRepository.findOne({ user });
        if (applicationDocuments) {
          return applicationDocuments;
        } else {
          throw new NotAcceptableException('not existed applicationDocuments');
        }
      } else {
        throw new NotAcceptableException('not existed user');
      }
    } catch (err) {
      throw err;
    }
  }

  async createSchedule(userId: string, createScheduleDto: CreateScheduleDTO) {
    try {
      const user = await this.userRepository.findOne({ userId });
      if (user) {
        this.scheduleRepository.save({
          createScheduleDto,
          user,
        });
      } else {
        throw new NotAcceptableException('not existed user');
      }
    } catch (err) {
      throw err;
    }
  }

  async getSchedule(scheduleId: number, userId: string) {
    try {
      const user = await this.userRepository.findOne({ userId });
      if (user) {
        const schedule = await this.scheduleRepository.findOne({
          id: scheduleId,
          user,
        });
        return schedule;
      } else {
        throw new NotAcceptableException('not existed user');
      }
    } catch (err) {
      throw err;
    }
  }

  async getAllSchedule(userId: string) {
    try {
      const user = await this.userRepository.findOne({ userId });
      if (user) {
        const scheduleList = await this.scheduleRepository.find({ user });
        return scheduleList;
      } else {
        throw new NotAcceptableException('not existed user');
      }
    } catch (err) {
      throw err;
    }
  }

  async updateSchedule(
    scheduleId: number,
    userId: string,
    updateScheduleDto: UpdateScheduleDTO,
  ) {
    try {
      const user = await this.userRepository.findOne({ userId });

      if (user) {
        const schedule = await this.scheduleRepository.findOne({
          id: scheduleId,
          user,
        });

        if (!schedule) {
          throw new NotAcceptableException('not existed schedule');
        }

        this.scheduleRepository.update(schedule, {
          ...updateScheduleDto,
        });
      } else {
        throw new NotAcceptableException('not existed user');
      }
    } catch (err) {
      throw err;
    }
  }

  async deleteSchedule(scheduleId: number, userId: string) {
    try {
      const user = await this.userRepository.findOne({ userId });

      if (user) {
        const schedule = await this.scheduleRepository.findOne({
          id: scheduleId,
          user,
        });

        if (!schedule) {
          throw new NotAcceptableException('not existed schedule');
        }
        await this.scheduleRepository.delete(schedule);
      }
    } catch (err) {
      throw err;
    }
  }
}
